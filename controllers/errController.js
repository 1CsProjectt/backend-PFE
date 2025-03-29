import { Sequelize } from "sequelize";
import appError from "../utils/appError.js";


// const { Sequelize } = require("sequelize");
// const appError = require("../utils/appError.js");


const handleJWTError = () => {
    return new appError("Invalid token. Please log in again.", 401);
};

const handleJWTExpiredError = () => {
    return new appError("Your token has expired. Please log in again.", 401);
};

// Handle DB errors (e.g., bad input like wrong type)
const handleSequelizeDatabaseError = err => {
    const message = `Invalid input: ${err.parent?.detail || err.message}`;
    return new appError(message, 400);
};

// Handle validation errors (e.g., "email is required")
const handleSequelizeValidationError = err => {
    const messages = err.errors.map(e => e.message).join('. ');
    return new appError(`Validation error: ${messages}`, 400);
};

// Handle UNIQUE constraint errors (e.g., "email must be unique")
const handleUniqueConstraintError = err => {
    const fields = err.errors.map(e => e.path).join(', ');
    const values = err.errors.map(e => e.value).join(', ');
    const message = `Duplicate entry: ${fields} (${values}) must be unique.`;
    return new appError(message, 400);
};

// Handle foreign key constraint errors
const handleForeignKeyConstraintError = err => {
    const message = `Invalid foreign key reference or constraint violation: ${err.message}`;
    return new appError(message, 400);
};


const errorhandler = (err, req, res, next) => {
    
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    
    if (err instanceof Sequelize.DatabaseError) {
        err = handleSequelizeDatabaseError(err);
    }

    if (err instanceof Sequelize.ValidationError) {
        err = handleSequelizeValidationError(err);
    }

    if (err instanceof Sequelize.UniqueConstraintError) {
        err = handleUniqueConstraintError(err);
    }

    if (err instanceof Sequelize.ForeignKeyConstraintError) {
        err = handleForeignKeyConstraintError(err);
    }
    if (err.name === "JsonWebTokenError") {
        err = handleJWTError();
    }

    if (err.name === "TokenExpiredError") {
        err = handleJWTExpiredError();
    }

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
};

export { errorhandler };



// module.exports = {
    //     errorhandler, 
    //   };

