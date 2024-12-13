import Product from "../model/product.model.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();


const s3 = new S3Client({
    region: process.env.AWS_REGION, // e.g., "us-east-1"
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const bucketName = process.env.S3_BUCKET_NAME;

export const uploadFileToS3 = async (file, key) => {
    try {
        const uploadParams = {
            Bucket: bucketName,
            Key: key, // File name in S3
            Body: file.buffer, // File data (from multer)
            ContentType: file.mimetype // File MIME type
        };

        const command = new PutObjectCommand(uploadParams);
        const response = await s3.send(command);
        // let url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
        // console.log("URL: ",url)
        return key;
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw new Error("File upload failed");
    }
};
// This should work both there and elsewhere.
function isEmptyObject(obj) {
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return true;
  }
  

export const getAllProducts = async (_req, res) => {
    try {
        const products = await Product.find();
        const productsWithImageUrl = products.map((product) => ({
            id: product._id,
            productName: product.productName,
            productDesc: product.productDesc,
            productNewPrice: product.productNewPrice,
            productOldPrice: product.productOldPrice,
            productCode: product.productCode,
            productNameImageUrl: product.productNameImageString ? product.productNameImageString : null,
            productFeaturesImageUrl: product.productFeaturesImageString ? product.productFeaturesImageString: null,
            additionalImagesUrls: product.additionalImagesString.length > 0 ?product.additionalImagesString: null,
            productGifUrl: product.productGifString ? product.productGifString : null
                        
            // productNameImageUrl: product.productNameImage ? `/product/image/${product._id}` : null,
            // productFeaturesImageUrl: product.productFeaturesImage ? `/product/featuresImage/${product._id}` : null,
            // additionalImagesUrls: product.additionalImages.map((_, index) => `/product/additional-image/${product._id}/${index}`),
            // productGifUrl: product.productGif ? `/product/gif/${product._id}` : null
        }));

        res.status(200).json({ status: 200, products: productsWithImageUrl });
    } catch (error) {
        console.log("Error> ", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (product) {
            const productWithUrls = {
                id: product._id,
                productName: product.productName,
                productDesc: product.productDesc,
                productNewPrice: product.productNewPrice,
                productOldPrice: product.productOldPrice,
                productCode: product.productCode,
                productNameImageUrl: product.productNameImageString ? product.productNameImageString : null,
                productFeaturesImageUrl: product.productFeaturesImageString ? product.productFeaturesImageString: null,
                additionalImagesUrls: product.additionalImagesString.length > 0 ? product.additionalImagesString: null,
                productGifUrl: product.productGifString ? product.productGifString : null
                        
            };

            res.status(200).json({ status: 200, data: productWithUrls });
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

export const getAdditionalImage = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        const index = req.params.index;
        
        if (product && product.additionalImages[index]) {
            res.contentType(product.additionalImages[index].contentType);
            res.send(product.additionalImages[index].data);
        } else {
            res.status(404).json({ message: "Additional image not found" });
        }
    }catch(error){
        console.log("Error> ",error)
        res.status(500).json(error)
    }
}

export const getFeaturesImage = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        const index = req.params.index;
        
        if (product && product.productFeaturesImage[index]) {
            res.contentType(product.productFeaturesImage[index].contentType);
            res.send(product.productFeaturesImage[index].data);
        } else {
            res.status(404).json({ message: "Additional image not found" });
        }
    }catch(error){
        console.log("Error> ",error)
        res.status(500).json(error)
    }
}

export const getProductNameImage = async (req, res) => {
    try {
        const { id, type } = req.params;
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        let image = null;
        // Determine which image to send based on type
        if (type === 'image' && product.productNameImage) {
            image = product.productNameImage;
        } else if (type === 'gif' && product.productGif) {
            image = product.productGif;
        }else if (type === 'features' && product.productFeaturesImage) {
            image = product.productFeaturesImage;
        } else {
            return res.status(404).json({ message: type+" Image not found" });
        }

        res.set("Content-Type", image.contentType);
        res.send(image.data);
    } catch (error) {
        console.log("Error fetching image:", error);
        res.status(500).json({ message: "Error retrieving image", error });
    }
};

export const insertProducts = async (req, res) => {
    try {
        const { productName, productDesc, productNewPrice, productOldPrice, productCode } = req.body;
        const product = await Product.findOne({ productCode });

        if (product) {
            return res.status(500).json({ message: "Product code already exists" });
        }

        // Prepare the product data
        const newProductData = {
            productName,
            productDesc,
            productNewPrice,
            productOldPrice,
            productCode,
            additionalImages: []
        };

        // Add additional images if provided
        if (req.files && req.files.additionalImages) {
            newProductData.additionalImages = req.files.additionalImages.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            }));
        }

        // Add main image if provided
        if (req.files && req.files.productNameImage) {
            newProductData.productNameImage = {
                data: req.files.productNameImage[0].buffer,
                contentType: req.files.productNameImage[0].mimetype
            };
        }

        // Add Features image if provided
        if (req.files && req.files.productFeaturesImage) {
            newProductData.productFeaturesImage = {
                data: req.files.productFeaturesImage[0].buffer,
                contentType: req.files.productFeaturesImage[0].mimetype
            };
        }

        // Add GIF if provided
        if (req.files && req.files.productGif) {
            newProductData.productGif = {
                data: req.files.productGif[0].buffer,
                contentType: req.files.productGif[0].mimetype
            };
        }

        const newProduct = new Product(newProductData);
        await newProduct.save();

        res.status(200).json({
            message: "Added successfully",
            product: {
                id: newProduct._id,
                productName: newProduct.productName,
                productDesc: newProduct.productDesc,
                productNewPrice: newProduct.productNewPrice,
                productOldPrice: newProduct.productOldPrice,
                productCode: newProduct.productCode,
                productNameImageUrl: req.files && req.files.productNameImage ? `/product/image/${newProduct._id}` : null,
                productFeaturesImageUrl: newProductData.productFeaturesImage ? `/product/features/${newProduct._id}` : null, // Fixed line
                additionalImagesUrls: newProductData.additionalImages.map((_, index) => `/product/additional-image/${newProduct._id}/${index}`),
                productGifUrl: req.files && req.files.productGif ? `/product/gif/${newProduct._id}` : null
            }
        });
    } catch (error) {
        console.log("Error> ", error);
        res.status(500).json(error);
    }
};

export const insertProductsWithS3 = async (req, res) => {
    try {
        console.log(req.body); // Log request body to debug
            const { productName, productDesc, productNewPrice, productOldPrice, productCode } = req.body;

            // Check for duplicate product code
            const existingProduct = await Product.findOne({ productCode });
            if (existingProduct) {
                return res.status(400).json({ message: "Product code already exists" });
            }
            
            // Prepare product data
            const newProductData = {
                productName,
                productDesc,
                productNewPrice,
                productOldPrice,
                productCode,
                additionalImagesString: []
            };

            // Upload images to S3 and store URLs in MongoDB
            if (req.files) {
                if (req.files.productNameImage) {
                    const url = await uploadFileToS3(req.files.productNameImage[0], `product-name/${Date.now()}-${req.files.productNameImage[0].originalname}`);
                    if(url !== undefined && url !== null){
                        newProductData.productNameImageString = url;
                    }
                }

                if (req.files.productFeaturesImage) {
                    const url = await uploadFileToS3(req.files.productFeaturesImage[0], `product-features/${Date.now()}-${req.files.productFeaturesImage[0].originalname}`);
                    if(url !== undefined && url !== null){
                        newProductData.productFeaturesImageString = url;
                    }
                }

                if (req.files.productGif) {
                    const url = await uploadFileToS3(req.files.productGif[0], `product-gifs/${Date.now()}-${req.files.productGif[0].originalname}`);
                    if(url !== undefined && url !== null){
                        newProductData.productGifString = url;
                    }
                }

                if (req.files.additionalImages) {
                    for (const file of req.files.additionalImages) {
                        const url = await uploadFileToS3(file, `additional-images/${Date.now()}-${file.originalname}`);
                        // console.log("insertProductsWithS3 url>> ", url);
                        if(url !== undefined && url !== null){
                            newProductData.additionalImagesString.push(url);
                        }
                    }
                }
            }

            // Save new product to MongoDB
            const newProduct = new Product(newProductData);
            await newProduct.save();

            res.status(200).json({
                message: "Product added successfully",
                product: {
                    id: newProduct._id,
                    productName: newProduct.productName,
                    productDesc: newProduct.productDesc,
                    productNewPrice: newProduct.productNewPrice,
                    productOldPrice: newProduct.productOldPrice,
                    productCode: newProduct.productCode,
                    productNameImageUrl: newProduct.productNameImageString || null,
                    productFeaturesImageUrl: newProduct.productFeaturesImageString || null,
                    additionalImagesUrls: newProduct.additionalImagesString,
                    productGifUrl: newProduct.productGifString || null
                }
            });
        } catch (error) {
            console.error("Error adding product: ", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
};

export const editProduct = async (req, res) => {
    try {
        const { id } = req.body;
        const updatedData = JSON.parse(req.body.updatedData); // Parse updatedData from JSON string

        // Check if the product exists
        const product = await Product.findOne({ _id: id });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // If a GIF file is provided, add it to updatedData
        if (req.files.productNameImage) {
            const gifFile = req.files.productNameImage[0];
            updatedData.productNameImage = {
                data: gifFile.buffer,
                contentType: gifFile.mimetype, // Store content type (e.g., image/gif)
            };
        }

        // If a GIF file is provided, add it to updatedData
        if (req.files.productFeaturesImage) {
            const gifFile = req.files.productFeaturesImage[0];
            updatedData.productFeaturesImage = {
                data: gifFile.buffer,
                contentType: gifFile.mimetype, // Store content type (e.g., image/gif)
            };
        }

        // If a GIF file is provided, add it to updatedData
        if (req.files.productGif) {
            const gifFile = req.files.productGif[0];
            updatedData.productGif = {
                data: gifFile.buffer,
                contentType: gifFile.mimetype, // Store content type (e.g., image/gif)
            };
        }

        // Update the product with the new data, including the GIF if it was uploaded
        await Product.updateOne({ _id: id }, { $set: updatedData });
        
        res.status(200).json({ message: "Product updated successfully" });
    } catch (error) {
        console.error("Error>", error);
        res.status(500).json({ message: "Failed to update product", error });
    }
};

export const editProductS3 = async (req, res) => {
    try {
        const { id } = req.body;
        const updatedData = JSON.parse(req.body.updatedData); // Parse updatedData from JSON string

        // Check if the product exists
        const product = await Product.findOne({ _id: id });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }


        // Update productNameImage
        if (req.files.productNameImage) {
            // Delete old image from S3
            if (product.productNameImageString) {
                // const oldKey = product.productNameImageString.split('.amazonaws.com/')[1];
                await deleteFileFromS3(product.productNameImageString);
            }

            // Upload new image to S3
            const file = req.files.productNameImage[0];
            const key = `product-name/${Date.now()}-${file.originalname}`;
            const url = await uploadFileToS3(file, key);
            if (url) updatedData.productNameImageString = url;
        }

        // Update productFeaturesImage
        if (req.files.productFeaturesImage) {
            // Delete old image from S3
            if (product.productFeaturesImageString) {
                // const oldKey = product.productFeaturesImageString.split('.amazonaws.com/')[1];
                await deleteFileFromS3(product.productFeaturesImageString);
            }

            // Upload new image to S3
            const file = req.files.productFeaturesImage[0];
            const key = `product-features/${Date.now()}-${file.originalname}`;
            const url = await uploadFileToS3(file, key);
            if (url) updatedData.productFeaturesImageString = url;
        }

        // Update productGif
        if (req.files.productGif) {
            // Delete old GIF from S3
            if (product.productGifString) {
                // const oldKey = product.productGifString.split('.amazonaws.com/')[1];
                await deleteFileFromS3(product.productGifString);
            }

            // Upload new GIF to S3
            const file = req.files.productGif[0];
            const key = `product-gifs/${Date.now()}-${file.originalname}`;
            const url = await uploadFileToS3(file, key);
            if (url) updatedData.productGifString = url;
        }

        // Update additionalImages
        if (req.files.additionalImages) {
            // Delete old additional images from S3
            if (product.additionalImagesString && product.additionalImagesString.length > 0) {
                for (const imageUrl of product.additionalImagesString) {
                    // const oldKey = imageUrl.split('.amazonaws.com/')[1];
                    await deleteFileFromS3(imageUrl);
                }
            }

            // Upload new additional images to S3
            updatedData.additionalImagesString = [];
            for (const file of req.files.additionalImages) {
                const key = `additional-images/${Date.now()}-${file.originalname}`;
                const url = await uploadFileToS3(file, key);
                if (url) updatedData.additionalImagesString.push(url);
            }
        }

        // Update the product in MongoDB
        await Product.updateOne({ _id: id }, { $set: updatedData });

        res.status(200).json({ message: "Product updated successfully" });
    } catch (error) {
        console.error("Error>", error);
        res.status(500).json({ message: "Failed to update product", error });
    }
};

export const updateProductGifInS3 = async (req, res) => {
    try {
        const { productId } = req.body;
        // Find the product by productId
        const product = await Product.findOne({ _id: productId });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        // Call before uploading the new GIF
        if (product.productGifString) {
            const s3Url = product.productGifString;            
            // Extract the key
            // const key = s3Url.split('.amazonaws.com/')[1];
            if (s3Url) {
                await deleteFileFromS3(s3Url);
            } else {
                console.error("Failed to extract key from S3 URL.");
            }
        }

        // Check if a new GIF file is provided
        if (req.files && req.files.productGif) {
            const newGifFile = req.files.productGif[0];
            
            // Define the new S3 key
            const newGifKey = `product-gifs/${Date.now()}-${newGifFile.originalname}`;

            // Upload the new GIF to S3
            const newGifUrl = await uploadFileToS3(newGifFile, newGifKey);

            // Update the MongoDB document with the new URL
            if (newGifUrl) {
                product.productGifString = newGifUrl;
            } else {
                return res.status(500).json({ message: "Failed to upload new GIF to S3" });
            }
        } else {
            return res.status(400).json({ message: "No GIF file provided" });
        }

        // Save the updated product
        await product.save();

        res.status(200).json({
            message: "GIF updated successfully",
            productGifUrl: product.productGifString
        });
    } catch (error) {
        console.error("Error updating GIF: ", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const deleteFileFromS3 = async (key) => {
    try {
        const deleteParams = {
            Bucket: bucketName,
            Key: key,
        };
        const command = new DeleteObjectCommand(deleteParams);
        await s3.send(command);
        // console.log(`File deleted successfully: ${key}`);
    } catch (error) {
        console.error("Error deleting file from S3:", error);
    }
};

export const updateProductGif = async (req, res) => {
    try {
        const { productId } = req.body;
        
        // Find the product by productCode
        const product = await Product.findOne({ _id: productId });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        // Check if a new GIF file is provided
        if (req.files && req.files.productGif) {
            product.productGif = {
                data: req.files.productGif[0].buffer,         // Buffer of the new GIF
                contentType: req.files.productGif[0].mimetype
            };
        } else {
            return res.status(400).json({ message: "No GIF file provided" });
        }

        // Save the updated product
        await product.save();

        res.status(200).json({
            message: "GIF updated successfully",
            productGifUrl: `/product/gif/${product._id}`
        });
    } catch (error) {
        console.log("Error> ", error);
        res.status(500).json(error);
    }
};

export const removeProduct = async (req, res) => {
    try {
        const { id } = req.body;

        // Check if the product exists
        const product = await Product.findOne({ _id: id });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Delete the product
        await Product.deleteOne({ _id: id });
        res.status(200).json({ message: "Product removed successfully" });
    } catch (error) {
        console.log("Error>", error);
        res.status(500).json({ message: "Failed to remove product", error });
    }
};

export const removeProductS3 = async (req, res) => {
    try {
        const { id } = req.body;

        // Check if the product exists
        const product = await Product.findOne({ _id: id });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const bucketName = process.env.S3_BUCKET_NAME;

        // Collect keys of assets to delete
        const keysToDelete = [];

        if (product.productNameImageString) {
            // const key = product.productNameImageString.split('.amazonaws.com/')[1];
            keysToDelete.push(product.productNameImageString);
        }

        if (product.productFeaturesImageString) {
            // const key = product.productFeaturesImageString.split('.amazonaws.com/')[1];
            keysToDelete.push(product.productFeaturesImageString);
        }

        if (product.productGifString) {
            // const key = product.productGifString.split('.amazonaws.com/')[1];
            keysToDelete.push(product.productGifString);
        }

        if (product.additionalImagesString && product.additionalImagesString.length > 0) {
            product.additionalImagesString.forEach((imageUrl) => {
                // const key = imageUrl.split('.amazonaws.com/')[1];
                keysToDelete.push(imageUrl);
            });
        }
        try{
            // Delete assets from S3 using the utility method
            const deletePromises = keysToDelete.map((key) => deleteFileFromS3(key));
            await Promise.all(deletePromises);
        }catch (error) {
            console.log("Delete assets from S3 Error>", error);
        }

        // Delete the product from the database
        await Product.deleteOne({ _id: id });
        res.status(200).json({ message: "Product and associated assets removed successfully" });
    } catch (error) {
        console.log("Error>", error);
        res.status(500).json({ message: "Failed to remove product", error });
    }
};