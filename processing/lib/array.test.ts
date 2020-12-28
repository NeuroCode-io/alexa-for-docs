import { chunk } from './array'

describe('Array', () => {
  let arr: any = []
  it('should chunk the array', () => {
    arr = new Array(100)
    const chunckedArr = chunk(arr, 50)

    expect(chunckedArr.length).toBe(2)
  })

  it('should throw for invalid input', () => {
    expect(() => chunk(arr, 0)).toThrow()
  })
})
