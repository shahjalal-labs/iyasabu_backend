import { product } from "@prisma/client";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import ApiError from "../../../errors/ApiErrors";
import { GetAllProductsResponse } from "./const";
import prisma from "../../../shared/prisma";

const createProduct = async (
  data: product,
  productImages: Express.Multer.File[]
) => {
  let imagesUpload = [];
  try {
    imagesUpload = await Promise.all(
      productImages.map(async (file: Express.Multer.File) => {
        return (await uploadToDigitalOceanAWS(file)).Location;
      })
    );
  } catch (error: any) {
    throw new ApiError(500, "Failed to upload images: " + error.message);
  }
  return await prisma.product.create({
    data: { ...data, images: imagesUpload },
  });
};

interface GetAllProductsParams {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

const getAllProducts = async (query: GetAllProductsParams) => {
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    searchTerm,
  }: GetAllProductsParams = query;

  // Calculate pagination
  const skip: number = (page - 1) * limit;

  // Build where conditions
  const where: any = {};

  // Search in name or description
  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Sort order
  const orderBy: any = {};
  if (sort) {
    const [field, direction] = sort.startsWith("-")
      ? [sort.substring(1), "desc"]
      : [sort, "asc"];
    orderBy[field] = direction;
  }

  // Fetch data with pagination
  const result = await prisma.product.findMany({
    where,
    orderBy,
    skip,
    take: Number(limit),
  });

  // Count total for pagination metadata
  const totalCount = await prisma.product.count({ where });

  const response: GetAllProductsResponse = {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)),
    },
    result,
  };

  return response;
};

const getProductById = async (id: string) => {
  const res = await prisma.product.findUnique({
    where: { id },
    include: {
      reviews: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });
  if (!res) {
    throw new ApiError(404, "Product not found");
  }
  return res;
};

const updateProduct = async (
  id: string,
  data: Partial<product>,
  productImages?: Express.Multer.File[]
) => {
  const isProductExist = await prisma.product.findUnique({
    where: {
      id,
    },
  });
  if (!isProductExist) {
    throw new ApiError(404, "Product not found");
  }

  let imagesUpload = isProductExist.images;
  if (productImages) {
    try {
      imagesUpload = await Promise.all(
        productImages.map(async (file: Express.Multer.File) => {
          return (await uploadToDigitalOceanAWS(file)).Location;
        })
      );
    } catch (error: any) {
      throw new ApiError(500, "Failed to upload images: " + error.message);
    }
  }
  return await prisma.product.update({
    where: { id },
    data: { ...data, images: imagesUpload },
  });
};

const bestSelling = async () => {
  return await prisma.product.findMany({
    where: {
      orderProduct: {
        some: {
          order: {
            status: "Delivered",
          },
        },
      },
    },
  });
};

const deleteProduct = async (id: string) => {
  const isExist = await prisma.product.findUnique({
    where: {
      id,
    },
  });
  if (!isExist) {
    throw new ApiError(404, "Product not found");
  }
  return await prisma.product.delete({ where: { id } });
};

export const productServices = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bestSelling,
};
