import mongoose from "mongoose";
import { GoalBankCategory, SupportLevel } from "../utils/enums/enums.js";
const goalBankModel = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        GoalBankCategory.FEDC_1,
        GoalBankCategory.FEDC_2,
        GoalBankCategory.FEDC_3,
        GoalBankCategory.FEDC_4,
        GoalBankCategory.FEDC_5,
        GoalBankCategory.FEDC_6,
        GoalBankCategory.FEDC_7,
        GoalBankCategory.FEDC_8,
        GoalBankCategory.FEDC_9,
      ],
    },

    discription: {
      type: String,
    },
    criteriaForMastry: {
      masteryPercentage: {
        type: Number,
        min: 1,
        max: 100,
      },
      acrossSession: {
        type: Number,
      },
      supportLevel: {
        type: String,
        enum: [
          SupportLevel.Independent,
          SupportLevel.Minimal,
          SupportLevel.Moderate,
        ],
      },
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    masteryBaseline:{
      type:Number
    }
  },
  {
    timestamps: true,
  }
);

const GoalBank = mongoose.model("GoalBank", goalBankModel);
export default GoalBank;
