import express from 'express';
import {
  getBudgets,
  getBudgetByTaskId,
  createBudget,
  updateBudgetByTaskId,
  deleteBudget,
  getBudgetAggregation,
} from '../controllers/budgetController.js';

const router = express.Router();

// Aggregation endpoint
router.get('/aggregation', getBudgetAggregation);

// CRUD Endpoints
router.get('/', getBudgets);
router.get('/task/:taskId', getBudgetByTaskId);
router.post('/', createBudget);
router.put('/task/:taskId', updateBudgetByTaskId);
router.delete('/:id', deleteBudget);

export default router;
