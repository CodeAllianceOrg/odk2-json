// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...

import { Base64 } from 'js-base64'

export class ODKConverter {
  public fromJSON(input: any): ODKSurvey {
    return new ODKSurvey()
  }
}

export class ODKSurvey {
  public toXLSXBase64(): string {
    return Base64.encode(
      [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21
      ].join(',')
    )
  }
}
