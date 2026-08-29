import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { roleController } from '../controllers/role.controller';
import { authMiddleware } from '@/common/middleware/auth-middleware';
import { validationMiddleware } from '@/common/middleware/validation-middleware';
import {
  loginSchema,
  otpVerifySchema,
  createUserSchema,
  updateUserSchema,
  createRoleSchema,
  updateRoleSchema,
} from '../validators/auth.schema';

const router = Router();

// Public routes
router.post('/login', validationMiddleware(loginSchema), authController.login);
router.post('/otp-verify', validationMiddleware(otpVerifySchema), authController.verifyOtp);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/unlock', authMiddleware, authController.unlockSession);

// User management (protected + permission check would be added)
router.get('/users', authMiddleware, userController.listUsers);
router.get('/users/:id', authMiddleware, userController.getUser);
router.post('/users', authMiddleware, validationMiddleware(createUserSchema), userController.createUser);
router.put('/users/:id', authMiddleware, validationMiddleware(updateUserSchema), userController.updateUser);
router.delete('/users/:id', authMiddleware, userController.deleteUser);

// Role management
router.get('/roles', authMiddleware, roleController.listRoles);
router.get('/roles/:id', authMiddleware, roleController.getRole);
router.post('/roles', authMiddleware, validationMiddleware(createRoleSchema), roleController.createRole);
router.put('/roles/:id', authMiddleware, validationMiddleware(updateRoleSchema), roleController.updateRole);
router.delete('/roles/:id', authMiddleware, roleController.deleteRole);

export default router;
