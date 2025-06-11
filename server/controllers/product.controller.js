const products = require("../data/products");
const productmodel = require("../models/product.model");

const getProducts = async (req, res) => {
  try {
    const dealsproducts = await productmodel
      .find({ category: "deals" })
      .limit(10);
    res.json(dealsproducts);
  } catch (err) {
    console.error("Failed to fetch deals products", err);
    res
      .status(500)
      .json({ message: "Server Error: Unable to fetch inspired products" });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productmodel.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
};

// Create new product
const createProduct = async (req, res) => {
  const { name, image, price, description, category } = req.body;

  const newProduct = new productmodel({
    name,
    image,
    price,
    description,
    category,
  });
  await newProduct.save();

  res.status(201).json({ message: "Product added", product: newProduct });
};

const getTopSellers = async (req, res) => {
  try {
    const products = await productmodel.find().limit(10);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

const getExploreShops = async (req, res) => {
  try {
    const shops = await productmodel.find({ category: "explore" });
    res.status(200).json(shops);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch explore shops" });
  }
};

const getFreshFinds = async (req, res) => {
  try {
    const items = await productmodel.find({ category: "fresh-finds" });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fresh finds" });
  }
};

const getInspiredProducts = async (req, res) => {
  try {
    const inspireproducts = await productmodel
      .find({ category: "insiperd" })
      .limit(10);
    res.json(inspireproducts);
  } catch (err) {
    console.error("Failed to fetch inspired products", err);
    res
      .status(500)
      .json({ message: "Server Error: Unable to fetch inspired products" });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productmodel.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Failed to fetch product details", err);
    res
      .status(500)
      .json({ message: "Server Error: Unable to fetch product details" });
  }
};

// getallProducts = async (req, res) => {
//      const limit = req.query.limit || 2;
//     const startIndex = req.query.startIndex || 0;
//     const sort = req.query.sort || "createdAt";
//     const order = req.query.order || "asc";
//     const search = req.query.search || "";
//     const category = req.query.category;
//     const totalDocument = await productmodel.countDocuments();

//     try {
//       const product = await productmodel.find({
//         category,
//         $or: [
//           { name: { $regex: search, $options: "i" } },
//           { description: { $regex: search, $options: "i" } },
//         ],
//       }

//     )
//         .limit(limit)
//         .sort({ [sort]: order === "asc" ? 1 : -1 })
//         .skip(startIndex);

//       if (!product || product.length === 0) {
//         return res.status(404).json({ message: "No product found" });
//       }
//       res
//         .status(200)
//         .json({ message: "Posts fetched successfully", product, totalDocument });
//     } catch (error) {
//       res.status(400).json({ message: error.message });
//     }

// }

const getallProducts = async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const startIndex = Number(req.query.startIndex) || 0;
  const sort = req.query.sort || "createdAt";
  const order = req.query.order || "asc";
  const search = req.query.search || "";
  const category = req.query.category;

  try {
    // Filter object banate hain
    let filter = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    };

    // Agar category diya gaya hai aur 'all' nahi hai to filter me lagao
    if (category && category !== "all") {
      filter.category = category;
    }

    const totalDocument = await productmodel.countDocuments(filter);

    const product = await productmodel
      .find(filter)
      .limit(limit)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip(startIndex);

    if (!product || product.length === 0) {
      return res.status(404).json({ message: "No product found" });
    }

    res.status(200).json({
      message: "Products fetched successfully",
      product,
      totalDocument,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  getTopSellers,
  getExploreShops,
  getFreshFinds,
  getInspiredProducts,
  getProductDetails,
  getallProducts,
};
