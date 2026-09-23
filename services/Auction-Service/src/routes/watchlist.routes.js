import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getUserWatchlistController,
  addToWatchlistController,
  removeFromWatchlistController,
} from '../controllers/watchlist.controller.js';

const router = Router();

// All watchlist routes require an authenticated user
router.use(requireAuth);

router.get('/', getUserWatchlistController);
router.post('/:auctionId', addToWatchlistController);
router.delete('/:auctionId', removeFromWatchlistController);

export default router;
