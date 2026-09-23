import { Router } from 'express';
import {
  listCategoriesController,
  getCategoryBySlugController,
} from '../controllers/category.controller.js';

const router = Router();

// Public Category Discovery
router.get('/', listCategoriesController);
router.get('/:slug', getCategoryBySlugController);

export default router;
