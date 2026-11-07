import {assertClosedReviewRoute} from '../tests/helpers/public-boundary.mjs';
const state=await assertClosedReviewRoute('api/review.js');
console.log('PASS  public review route is '+state+'; no public record processing restored');
