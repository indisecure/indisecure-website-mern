const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    tags: {
      type: [String],
      default: [],
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function (v) {
            // allow empty or valid [lng, lat]
            return (
              !v ||
              (Array.isArray(v) &&
                v.length === 2 &&
                v[0] >= -180 &&
                v[0] <= 180 &&
                v[1] >= -90 &&
                v[1] <= 90)
            );
          },
          message: (props) => `Invalid coordinates: ${props.value}`,
        },
      },
    },
  },
  { timestamps: true }
);

// ✅ Indexes
CourseSchema.index({ location: '2dsphere' }); // for geo search
CourseSchema.index({ name: 'text', tags: 'text', description: 'text' }); // for text search

module.exports = mongoose.model('Course', CourseSchema);
