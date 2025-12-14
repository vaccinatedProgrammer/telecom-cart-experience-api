import app from './app';
import { info } from './utils/logger';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  info(`Server running on port ${PORT}`);
});
