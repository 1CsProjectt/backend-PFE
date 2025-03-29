import {DataTypes} from "sequelize";
import sequelize from '../config/database.js';
import Student from "./studenModel.js";



const invitation =sequelize.define("invitation",{
    id:{type:DataTypes.INTEGER,autoIncrement:true,primaryKey:true},
    sender_id:{type:DataTypes.INTEGER,allowNull:false},
    receiver_email: { type: DataTypes.STRING, allowNull: false },
    status:{
        type:DataTypes.ENUM("pending","accepted","rejected"),
        defaultValue:"pending"
    }
    
})

invitation.belongsTo(Student,{foreignKey:"sender_id",as:"sender"})


export default invitation;
