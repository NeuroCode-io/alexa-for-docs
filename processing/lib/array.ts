const chunk = <T>(array: T[], chunkSize: number): T[][] => {
  if (chunkSize <= 0) throw new Error('Invalid chunk size')

  const R = []
  for (let i = 0, len = array.length; i < len; i += chunkSize) R.push(array.slice(i, i + chunkSize))

  return R
}

export { chunk }
