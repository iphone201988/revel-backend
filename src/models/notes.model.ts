import mongoose from "mongoose";

const reportsModel = new mongoose.Schema({
    sessionId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Session"
    },
    plan:{
        type:String
    },
    fedcObservation:{
        type:String
    },
    interactionsAndAffect:{
        type:String
    },
    presentationAndEngagement:{
        type:String
    },
    goalProgress:[
        {
            masteryCriteria:{ type:String},
            progressReport:{type:String}
        }
    ],
    signature:{
        type:String
    }

    
})

const Report =  mongoose.model("Report", reportsModel);
export default Report