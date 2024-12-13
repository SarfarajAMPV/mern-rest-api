import express from "express";
import { 
    getAllProducts, 
    getProduct, 
    getProductNameImage, 
    getAdditionalImage, 
    getFeaturesImage,
    insertProducts, 
    insertProductsWithS3,
    editProductS3,
    updateProductGifInS3,
    removeProductS3 
} from "../controller/product.controller.js";
import multer from 'multer'

// Multer setup for file uploads (in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
    { name: 'productNameImage', maxCount: 1 },
    { name: 'productFeaturesImage', maxCount: 1 },
    { name: 'productGif', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
]);


const router =  express.Router()

router.get("/getAllProducts", getAllProducts)
router.get("/getProduct/:id", getProduct)
router.post("/insetProduct", upload,insertProducts)
router.post("/insertProductsWithS3", upload,insertProductsWithS3)
router.post("/removeProduct", removeProductS3)
router.post("/editProduct", upload, editProductS3);
// New route for updating only the GIF of a product
router.post("/updateProductGif", upload, updateProductGifInS3);
router.get("/:type/:id", getProductNameImage);
router.get("/additional-image/:id/:index", getAdditionalImage);

export default router;