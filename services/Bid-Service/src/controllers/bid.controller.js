import * as bidService from '../services/bid.service.js';
import * as autoBidService from '../services/auto-bid.service.js';
import { successResponse } from '../utils/api-response.js';

export async function placeBidController(req, res, next) {
  try {
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    const result = await bidService.placeBid({
      userId: req.user.id,
      auctionId: req.body.auctionId,
      amount: req.body.amount,
      idempotencyKey,
      ipAddress,
    });

    return successResponse(
      res,
      result,
      result.isIdempotentReplay ? 'Bid previously processed (Idempotent response)' : 'Bid placed successfully',
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function getAuctionBidHistoryController(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await bidService.getAuctionBidHistory(req.params.auctionId, query);
    return successResponse(
      res,
      result.bids,
      'Bid history retrieved successfully',
      200,
      result.pagination
    );
  } catch (err) {
    next(err);
  }
}

export async function getUserBidsController(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await bidService.getUserBids(req.user.id, query);
    return successResponse(
      res,
      result.bids,
      'User bids retrieved successfully',
      200,
      result.pagination
    );
  } catch (err) {
    next(err);
  }
}

export async function setAutoBidController(req, res, next) {
  try {
    const autoBid = await autoBidService.setAutoBid({
      userId: req.user.id,
      auctionId: req.body.auctionId,
      maxBudget: req.body.maxBudget,
    });
    return successResponse(res, { autoBid }, 'Auto-bid configuration updated successfully', 200);
  } catch (err) {
    next(err);
  }
}

export async function getAutoBidController(req, res, next) {
  try {
    const autoBid = await autoBidService.getAutoBid(req.user.id, req.params.auctionId);
    return successResponse(res, { autoBid }, 'Auto-bid details retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function cancelAutoBidController(req, res, next) {
  try {
    const result = await autoBidService.cancelAutoBid(req.user.id, req.params.auctionId);
    return successResponse(res, { autoBid: result }, 'Auto-bid cancelled successfully');
  } catch (err) {
    next(err);
  }
}
