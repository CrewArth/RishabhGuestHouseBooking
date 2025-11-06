import Joi from 'joi';

export const createRoomSchema = Joi.object({
  guestHouseId: Joi.number().integer().min(1).required(),
  roomNumber: Joi.number().integer().min(1).required(),
  roomType: Joi.string().valid('single', 'double', 'family').required(),
  roomCapacity: Joi.number().integer().min(1).required(),
  isAvailable: Joi.boolean().optional()
});

export const updateRoomSchema = Joi.object({
  roomNumber: Joi.number().integer().min(1).optional(),
  roomType: Joi.string().valid('single', 'double', 'family').optional(),
  roomCapacity: Joi.number().integer().min(1).optional(),
  isAvailable: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
}).min(1); // must update at least one field

export const listRoomsQuerySchema = Joi.object({
  guestHouseId: Joi.number().integer().min(1).optional(),
  roomType: Joi.string().valid('single', 'double', 'family').optional(),
  isAvailable: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('createdAt', 'roomNumber', 'roomType', 'roomCapacity').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});
