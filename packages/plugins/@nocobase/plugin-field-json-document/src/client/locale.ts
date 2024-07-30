/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { i18n } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'field-json-document';

export function lang(key: string) {
  return i18n.t(key, { ns: [NAMESPACE, 'client'] });
}

export function useJSONDocTranslation() {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}