import OtpOrder from "../models/OtpOrder.js";
import Service from "../models/service.js";
import NumberInventory from "../models/NumberInventory.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";

const generateReference = () => {
  return `TRX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

export const createOtpOrder = async (req, res, next) => {
  try {
    const { serviceId } = req.body;

    if (!serviceId) {
      res.status(400);
      throw new Error("Service ID is required");
    }

    const service = await Service.findById(serviceId);

    if (!service) {
      res.status(404);
      throw new Error("Service not found");
    }

    if (service.status !== "active") {
      res.status(400);
      throw new Error("Selected service is not active");
    }

    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      res.status(404);
      throw new Error("Wallet not found");
    }

    if (wallet.balance < service.price) {
      res.status(400);
      throw new Error("Insufficient wallet balance");
    }

    const availableNumber = await NumberInventory.findOne({
      country: service.country,
      serviceType: service.category === "voice" ? "voice" : "otp",
      status: "available"
    });

    if (!availableNumber) {
      res.status(400);
      throw new Error("No available number for this service right now");
    }

    wallet.balance -= service.price;
    await wallet.save();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const otpOrder = await OtpOrder.create({
      user: req.user._id,
      service: service._id,
      numberInventory: availableNumber._id,
      price: service.price,
      status: "active",
      expiresAt
    });

    availableNumber.status = "assigned";
    availableNumber.assignedTo = req.user._id;
    await availableNumber.save();

    await Transaction.create({
      user: req.user._id,
      wallet: wallet._id,
      type: "debit",
      amount: service.price,
      description: `OTP order payment for ${service.name}`,
      status: "completed",
      reference: generateReference()
    });

    const populatedOrder = await OtpOrder.findById(otpOrder._id)
      .populate("user", "firstName lastName email")
      .populate("service")
      .populate("numberInventory");

    res.status(201).json({
      message: "OTP order created successfully",
      otpOrder: populatedOrder,
      walletBalance: wallet.balance
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOtpOrders = async (req, res, next) => {
  try {
    const orders = await OtpOrder.find({ user: req.user._id })
      .populate("service")
      .populate("numberInventory")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Your OTP orders fetched successfully",
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleOtpOrder = async (req, res, next) => {
  try {
    const order = await OtpOrder.findById(req.params.id)
      .populate("service")
      .populate("numberInventory")
      .populate("user", "firstName lastName email");

    if (!order) {
      res.status(404);
      throw new Error("OTP order not found");
    }

    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not allowed to view this order");
    }

    res.status(200).json({
      message: "OTP order fetched successfully",
      order
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOtpOrder = async (req, res, next) => {
  try {
    const order = await OtpOrder.findById(req.params.id).populate("service");

    if (!order) {
      res.status(404);
      throw new Error("OTP order not found");
    }

    if (order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not allowed to cancel this order");
    }

    if (order.status === "completed" || order.status === "cancelled") {
      res.status(400);
      throw new Error("This order cannot be cancelled");
    }

    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      res.status(404);
      throw new Error("Wallet not found");
    }

    wallet.balance += order.price;
    await wallet.save();

    order.status = "cancelled";
    await order.save();

    const number = await NumberInventory.findById(order.numberInventory);
    if (number) {
      number.status = "available";
      number.assignedTo = null;
      await number.save();
    }

    await Transaction.create({
      user: req.user._id,
      wallet: wallet._id,
      type: "refund",
      amount: order.price,
      description: `Refund for cancelled OTP order ${order._id}`,
      status: "completed",
      reference: generateReference()
    });

    res.status(200).json({
      message: "OTP order cancelled successfully",
      order,
      walletBalance: wallet.balance
    });
  } catch (error) {
    next(error);
  }
};
export const getAllOtpOrdersForAdmin = async (req, res, next) => {
  try {
    const orders = await OtpOrder.find()
      .populate("user", "firstName lastName email")
      .populate("service")
      .populate("numberInventory")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Admin OTP orders fetched successfully",
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

export const updateOtpOrderStatusByAdmin = async (req, res, next) => {
  try {
    const { status, otpCode } = req.body;

    const order = await OtpOrder.findById(req.params.id)
      .populate("service")
      .populate("numberInventory")
      .populate("user", "firstName lastName email");

    if (!order) {
      res.status(404);
      throw new Error("OTP order not found");
    }

    const allowedStatuses = ["pending", "active", "completed", "cancelled", "expired"];

    if (status && !allowedStatuses.includes(status)) {
      res.status(400);
      throw new Error("Invalid order status");
    }

    if (status) {
      order.status = status;
    }

    if (otpCode !== undefined) {
      order.otpCode = otpCode;
    }

    await order.save();

    if ((status === "completed" || status === "cancelled" || status === "expired") && order.numberInventory) {
      const number = await NumberInventory.findById(order.numberInventory._id);

      if (number) {
        number.status = status === "completed" ? "used" : "available";
        if (status !== "completed") {
          number.assignedTo = null;
        }
        await number.save();
      }
    }

    res.status(200).json({
      message: "OTP order updated successfully",
      order
    });
  } catch (error) {
    next(error);
  }
};