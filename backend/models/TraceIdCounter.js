const mongoose = require("mongoose");

const traceIdCounterSchema = mongoose.Schema(
  {
    _id: { type: String, required: true }, // Category code e.g. "HNG", "TUR"
    sequence: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const TraceIdCounter = mongoose.model("TraceIdCounter", traceIdCounterSchema);
module.exports = TraceIdCounter;
