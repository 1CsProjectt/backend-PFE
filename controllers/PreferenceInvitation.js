const RequestModel = require("../models/RequestModel"); // Assuming you have a RequestModel
const { default: Student } = require("../models/studenModel");
const sendNotification = require("../utils/sendNotification"); // Utility to send notifications (e.g., email)

module.exports = async function sendRequestToSupervisors(req, res) {
    try {
        const { prefereces } = req.body;
        const studentId = req.user.id;
        

        if(!Array.isArray(prefereces)||prefereces.length==5){ {
            return res.status(400).json({ error: "you must provide exactly 5 prefereces." });
        }
         }
        const student=await Student.findByPk(studentId);
        if (!student) {
            return next(new appError("Student not found", 404)); 
        }
        if(!student.team_id){
            return next(new appError("Student not in a team", 400)); 
        }
        
        


        

   
    } catch (error) {
        console.error("Error in sendRequestToSupervisors:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};