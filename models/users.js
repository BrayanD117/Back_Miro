const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({

    identification: {
        type: Number,
        index: {
            unique: true
        },
        required: true
    },
    full_name: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    roles: {
        type: [String],
        default: ["Usuario"]
    },
    activeRole: {
        type: String,
        default: "Usuario",
      },
    email: {
        type: String,
        required: true,
        index: {
            unique: true,            
        }
    },
    isActive: {
        type: Boolean,
        default: true,
    }
    
},
{
    versionKey: false,
    timestamps: true
}
);

module.exports = mongoose.model('users', userSchema);