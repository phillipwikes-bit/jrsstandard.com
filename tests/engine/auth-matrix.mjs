import {assertClosedReviewRoute,retiredReviewRoutes,assertConceptualManifest} from '../helpers/public-boundary.mjs';
for(const route of retiredReviewRoutes){
 const state=await assertClosedReviewRoute(route);
 console.log('PASS  '+route+': '+state+', no public record evaluation');
}
assertConceptualManifest();
console.log('PASS  conceptual Manifest; three machine-readable routes remain blocked');
console.log('Scope: source and local refusal checks only. Deployed behavior and release gates are NOT ESTABLISHED.');
