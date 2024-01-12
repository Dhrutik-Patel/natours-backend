class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach((el) => delete queryObj[el]);

        // Add $ to operators to make them work with mongoose methods (e.g. $gte)
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        );

        // Build query
        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            // Sort by multiple fields: /api/v1/tours?sort=price,ratingsAverage
            const sortBy = this.queryString.sort.split(',').join(' '); // replace comma with space: price ratingsAverage
            this.query = this.query.sort(sortBy); // sort('price ratingsAverage')
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            // Select fields: /api/v1/tours?fields=name,duration,difficulty,price
            const fields = this.queryString.fields.split(',').join(' '); // replace comma with space: name duration difficulty price
            this.query = this.query.select(fields); // select('name duration difficulty price')
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;
