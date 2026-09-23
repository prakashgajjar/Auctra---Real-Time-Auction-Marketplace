import * as watchlistService from '../services/watchlist.service.js';
import { successResponse } from '../utils/api-response.js';

export async function getUserWatchlistController(req, res, next) {
  try {
    const watchlist = await watchlistService.getUserWatchlist(req.user.id);
    return successResponse(res, { watchlist }, 'Watchlist retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function addToWatchlistController(req, res, next) {
  try {
    const result = await watchlistService.addToWatchlist(req.user.id, req.params.auctionId);
    return successResponse(res, result, 'Auction added to watchlist');
  } catch (err) {
    next(err);
  }
}

export async function removeFromWatchlistController(req, res, next) {
  try {
    const result = await watchlistService.removeFromWatchlist(req.user.id, req.params.auctionId);
    return successResponse(res, result, 'Auction removed from watchlist');
  } catch (err) {
    next(err);
  }
}
