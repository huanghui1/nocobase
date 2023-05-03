import { GeneralField } from '@formily/core';
import { useFieldSchema } from '@formily/react';
import cloneDeep from 'lodash/cloneDeep';
import { useCallback, useContext, useMemo } from 'react';
import { useDesignable } from '../../hooks';
import { mergeFilter } from '../../../block-provider/SharedFilterProvider';
import { AssociationFieldContext } from './context';
import { useRecord } from '../../../record-provider';
import { isInFilterFormBlock } from '../../../filter-provider';
import { useCollection, useCollectionManager } from '../../../collection-manager';

export const useInsertSchema = (component) => {
  const fieldSchema = useFieldSchema();
  const { insertAfterBegin } = useDesignable();
  const insert = useCallback(
    (ss) => {
      const schema = fieldSchema.reduceProperties((buf, s) => {
        if (s['x-component'] === 'AssociationField.' + component) {
          return s;
        }
        return buf;
      }, null);
      if (!schema) {
        insertAfterBegin(cloneDeep(ss));
      }
    },
    [component],
  );
  return insert;
};

export function useAssociationFieldContext<F extends GeneralField>() {
  return useContext(AssociationFieldContext) as { options: any; field: F };
}

export default function useServiceOptions(props) {
  const { action = 'list', service, fieldNames } = props;
  const params = service?.params || {};
  const fieldSchema = useFieldSchema();
  const { getField, fields } = useCollection();
  const { getCollectionFields } = useCollectionManager();
  const record = useRecord();

  const normalizeValues = useCallback(
    (obj) => {
      if (obj && typeof obj === 'object') {
        return obj[fieldNames.value];
      }
      return obj;
    },
    [fieldNames.value],
  );

  const value = useMemo(() => {
    if (props.value === undefined || props.value === null) {
      return;
    }
    if (Array.isArray(props.value)) {
      return props.value.map(normalizeValues);
    } else {
      return [normalizeValues(props.value)];
    }
  }, [props.value, normalizeValues]);

  const collectionField = useMemo(() => {
    return getField(fieldSchema.name);
  }, [fieldSchema.name]);
  const sourceValue = record?.[collectionField?.sourceKey];
  const filter = useMemo(() => {
    const isOToAny = ['oho', 'o2m'].includes(collectionField?.interface);
    return mergeFilter(
      [
        mergeFilter([
          isOToAny && !isInFilterFormBlock(fieldSchema)
            ? {
                [collectionField.foreignKey]: {
                  $is: null,
                },
              }
            : null,
          params?.filter,
        ]),
        isOToAny && sourceValue !== undefined && sourceValue !== null && !isInFilterFormBlock(fieldSchema)
          ? {
              [collectionField.foreignKey]: {
                $eq: sourceValue,
              },
            }
          : null,
        params?.filter && value
          ? {
              [fieldNames.value]: {
                ['$in']: value,
              },
            }
          : null,
      ],
      '$or',
    );
  }, [params?.filter, getCollectionFields, collectionField, sourceValue, value, fieldNames.value]);

  return useMemo(() => {
    return {
      resource: collectionField?.target,
      action,
      ...service,
      params: { ...service?.params, filter },
    };
  }, [collectionField?.target, action, filter, service]);
}

export const useFieldNames = (props) => {
  const fieldSchema = useFieldSchema();
  const fieldNames =
    fieldSchema['x-component-props']?.['field']?.['uiSchema']?.['x-component-props']?.['fieldNames'] ||
    fieldSchema?.['x-component-props']?.['fieldNames'] ||
    props.fieldNames;
  return { label: 'label', value: 'value', ...fieldNames };
};
