import * as auctionService from '../services/auction.service.js';
import { successResponse } from '../utils/api-response.js';

export async function createAuctionController(req, res, next) {
  try {
    const auction = await auctionService.createAuction(req.user.id, req.body);
    return successResponse(res, { auction }, 'Auction created successfully as draft', 201);
  } catch (err) {
    next(err);
  }
}

export async function publishAuctionController(req, res, next) {
  try {
    const auction = await auctionService.publishAuction(req.user.id, req.params.id);
    return successResponse(
      res,
      { auction },
      `Auction published successfully. Status: ${auction.status}`
    );
  } catch (err) {
    next(err);
  }
}

export async function cancelAuctionController(req, res, next) {
  try {
    const auction = await auctionService.cancelAuction(req.user.id, req.params.id);
    return successResponse(res, { auction }, 'Auction cancelled successfully.');
  } catch (err) {
    next(err);
  }
}

export async function getAuctionDetailsController(req, res, next) {
  try {
    const auction = await auctionService.getAuctionDetails(req.params.id, req.user?.id);
    return successResponse(res, { auction }, 'Auction details retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function listPublicAuctionsController(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await auctionService.listPublicAuctions(query, req.user?.id);
    return successResponse(
      res,
      result.auctions,
      'Auctions retrieved successfully',
      200,
      result.pagination
    );
  } catch (err) {
    next(err);
  }
}

export async function listSellerAuctionsController(req, res, next) {
  try {
    const auctions = await auctionService.listSellerAuctions(req.user.id);
    return successResponse(res, { auctions }, 'Seller auctions retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateAuctionController(req, res, next) {
  try {
    const auction = await auctionService.updateAuction(req.user.id, req.params.id, req.body);
    return successResponse(res, { auction }, 'Auction updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteAuctionController(req, res, next) {
  try {
    const result = await auctionService.deleteAuction(req.user.id, req.params.id);
    return successResponse(res, result, 'Draft auction deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function buyNowController(req, res, next) {
  try {
    const auction = await auctionService.buyNow(req.user.id, req.params.id);
    return successResponse(
      res,
      { auction },
      `Lot successfully purchased via Buy Now for ₹${auction.winningBid}`,
      200
    );
  } catch (err) {
    next(err);
  }
}

export async function listBuyerWonAuctionsController(req, res, next) {
  try {
    const auctions = await auctionService.listBuyerWonAuctions(req.user.id);
    return successResponse(res, { auctions }, 'Won auctions retrieved successfully');
  } catch (err) {
    next(err);
  }
}

