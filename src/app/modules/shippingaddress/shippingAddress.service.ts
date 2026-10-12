import { PrismaClient, shippingAddress } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
const prisma = new PrismaClient();

const createShippingAddress = async (data: shippingAddress, userId: string) => {
  return await prisma.shippingAddress.create({
    data: { ...data, userId: userId },
  });
};

const getMyShippingAddresss = async (userId: string) => {
  const res = await prisma.shippingAddress.findMany({
    where: {
      userId,
    },
  });

  if (!res) {
    throw new ApiError(httpStatus.NOT_FOUND, "shipping Address are  not found");
  }
  return res
};

const getShippingAddressById = async (id: string) => {
  const res = await prisma.shippingAddress.findUnique({ where: { id } });
  if (!res) {
    throw new ApiError(httpStatus.NOT_FOUND, "product not found");
  }
  return res
};

const updateShippingAddress = async (
  id: string,
  data: Partial<shippingAddress>,
  userId: string
) => {
  const isExist = await prisma.shippingAddress.findUnique({ where: { id } });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "product not found");
  }
  if(isExist.userId !== userId){
    throw new ApiError(httpStatus.NOT_FOUND, "you are not authorized to update this product");
  }
  return await prisma.shippingAddress.update({ where: { id }, data });
};

const deleteShippingAddress = async (id: string) => {
  const isExist = await prisma.shippingAddress.findUnique({ where: { id } });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "product not found");
  }
  return await prisma.shippingAddress.delete({ where: { id } });
};

export const shippingAddressServices = {
  createShippingAddress,
  getMyShippingAddresss,
  getShippingAddressById,
  updateShippingAddress,
  deleteShippingAddress,
};
