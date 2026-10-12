import { PrismaClient, shippingCost } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
const prisma = new PrismaClient();

const createShippingCost = async (data: shippingCost) => {
  if(!data.cost){
    throw new ApiError(403,"Cost is required");
  }
  const isExisting = await prisma.shippingCost.findFirst();

  if (isExisting) {
    // need to update 
    const res = await prisma.shippingCost.update({
      where: { id: isExisting.id },
      data,
    });
    return res;
  }
  return await prisma.shippingCost.create({ data });
};

const getAllShippingCosts = async () => {
  return await prisma.shippingCost.findMany();
};

// const getShippingCostById = async (id: string) => {
//   return await prisma.shippingCost.findUnique({ where: { id } });
// };

// const updateShippingCost = async (id: string, data: any) => {
//   return await prisma.shippingCost.update({ where: { id }, data });
// };

// const deleteShippingCost = async (id: string) => {
//   return await prisma.shippingCost.delete({ where: { id } });
// };

export const shippingCostServices = {
  createShippingCost,
  getAllShippingCosts,
  // getShippingCostById,
  // updateShippingCost,
  // deleteShippingCost,
};
