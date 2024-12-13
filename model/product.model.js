import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    productDesc: {
        type: String,
        required: true
    },
    productNewPrice: {
        type: Number,
        required: true
    },
    productOldPrice: Number,
    productCode: {
        type: String,
        required: true
    },
    productNameImage: {
        data: Buffer,
        contentType: String
    },
    productFeaturesImage: {
        data: Buffer,
        contentType: String
    },
    additionalImages: [
        {
            data: Buffer,
            contentType: String
        }
    ],
    productGif: {
        data: Buffer,          // Store GIF as binary data
        contentType: String    // Content type (e.g., image/gif)
    },

    productNameImageString: {
        type: String, // URL of the product name image
        required: false
    },
    productFeaturesImageString: {
        type: String, // URL of the product features image
        required: false
    },
    additionalImagesString: [
        {
            type: String // URLs of additional images
        }
    ],
    productGifString: {
        type: String, // URL of the product GIF
        required: false
    }
})

const Product = mongoose.model("Product", productSchema)

export default Product;