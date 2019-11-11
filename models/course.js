const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },
    text: {
        type: String
    },
    user: {
        type: String
    }
})

const CourseSchema = new mongoose.Schema({
	coursecode: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 6,
        trim: true,
        uppercase: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    credits: {
        type: Number,
        required: true
    },
    prerequisites: {
        type: {}
    },
    breadths: {
        type: [Number],
    },
    reviews: {
        type: [ReviewSchema]
    }
})

const Course = mongoose.model("Course", CourseSchema)

module.exports = {Course};
