# UI Contract: Event Attachment Links

## Event details attachment section

Given an expanded event details disclosure:

- If at least one normalized attachment exists, render a localized attachment heading and one link for each attachment.
- If an attachment has a non-empty name, use that name as link text.
- If it has no name, use a localized generic label that distinguishes it as an attachment.
- Every link uses the normalized HTTP(S) URL, opens in a new browsing context, and includes `rel="noreferrer noopener"`.
- Feed-provided names are rendered as text and must not create markup.
- If there are no normalized attachments, render no attachment heading or empty list.

## Normalization contract

- Only absolute `http` and `https` URLs are exposed.
- Invalid values, unsupported schemes, and binary attachments are omitted per-property.
- The containing occurrence remains renderable when attachment parsing fails.
