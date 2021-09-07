const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema;

const CartItemSchema = new mongoose.Schema(
  {
    meal: { type: ObjectId, ref: "Meal" },
    name: String,
    price: Number,
    count: Number
  },
  { timestamps: true }
);

const CartItem = mongoose.model("CartItem", CartItemSchema);

const OrderSchema = new mongoose.Schema(
  {
    meals: [CartItemSchema],
    transaction_id: {},
    amount: { type: Number },
    address: String,
    status: {
      type: String,
      default: "Not processed",
      enum: ["Not processed", "Processing", "Shipped", "Delivered", "Cancelled"] // enum means string objects
    },
    updated: Date,
    user: { type: ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);

module.exports = { Order, CartItem };
