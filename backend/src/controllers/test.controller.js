// Test controller
export const getTest = (req, res) => {
  res.json({ message: 'GET test endpoint' });
};

export const createTest = (req, res) => {
  res.json({ message: 'POST test endpoint', data: req.body });
};
