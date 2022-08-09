import type { ObjectId } from './third-party'

export type MyObject = {
  /**
   * @TJS-type string
   * @description Overrides aliased type definition with this JSDoc if at least TJS-type annotation is present
   */
  _id: ObjectId
}
