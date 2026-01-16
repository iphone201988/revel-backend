import express from "express";

export const stripeRawBody = express.raw({
  type: "application/json",
});
