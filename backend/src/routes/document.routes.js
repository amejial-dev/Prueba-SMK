const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const documentController = require('../controllers/document.controller');

const router = Router();

router.post('/', authenticate, upload.single('file'), documentController.upload);
router.get('/', authenticate, documentController.list);
router.get('/:id/download', authenticate, documentController.download);
router.delete('/:id', authenticate, authorize(['admin']), documentController.remove);

module.exports = router;
