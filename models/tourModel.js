const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
const User = require('./userModel');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [
                40,
                'A tour name must have less or equal then 40 characters',
            ],
            minlength: [
                10,
                'A tour name must have more or equal then 10 characters',
            ],
            // validate: [validator.isAlpha, 'Tour name must only contain characters']
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either: easy, medium, difficult',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    // this only points to current doc on NEW document creation
                    return val < this.price;
                },
                message:
                    'Discount price ({VALUE}) should be below regular price',
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a description'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false,
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        guides: [
            // Child referencing (embedding user data into tour document)
            // Ex: guides: Array(2) [Object, Object]
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
        // reviews: [
        //     // Child referencing (embedding user data into tour document)
        //     // Ex: guides: Array(2) [Object, Object]
        //     {
        //         type: mongoose.Schema.ObjectId,
        //         ref: 'Review',
        //     },
        // ],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual properties
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});

/* 
    Mongoose middleware
    - Document middleware: runs before .save() and .create()
    - Query middleware: runs before .find() and .findOne()
    - Aggregate middleware: runs before .aggregate()
*/

// Set slug property to slugified version of name
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// Remove secret tours from all queries
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });

    this.start = Date.now();
    next();
});

// Remove secret tours from aggregation pipeline
tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    next();
});

// Add user object to guides array in tour document instead of just storing user id
// Embedding user data into tour document
// tourSchema.pre('save', async function (next) {
//     console.log('STARTING POPULATE: ', this.guides);
//     const guidesPromises = this.guides.map(
//         async (id) => await User.findById(id)
//     );

//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// Populate guides array with user data instead of just storing user id
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt',
    });
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
