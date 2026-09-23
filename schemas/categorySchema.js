const { z } = require('zod');
const categoryBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  parent_id: z.preprocess(
    (val) => (val === '' || val === null ? null : (val === undefined ? undefined : Number(val))),
    z.number().int().positive().nullable().optional()
  ),
  bg_image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  show_on_home: z.union([z.boolean(), z.string().transform(v => v === 'true')]).optional(),
});

module.exports = {
  categoryBodySchema,
};
