import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormToggleSwitch, Modal } from 'stratosphere-ui';

import {
  LIMIT_OPTIONS,
  ORDER_BY_OPTIONS,
  type Filters,
} from '../lib/constants';
import { useFilters } from '../lib/useFilters';

interface FiltersModalProps {
  open: boolean;
  onClose: () => void;
}

// Web port of src/screens/Filters.js
const FiltersModal = ({ open, onClose }: FiltersModalProps) => {
  const { filters, setFilters } = useFilters();
  const methods = useForm<Filters>({ defaultValues: filters });
  const { register, watch, reset, handleSubmit } = methods;

  useEffect(() => {
    if (open) reset(filters);
  }, [open, filters, reset]);

  const dateEnabled = watch('dateEnabled');
  const minMagnitude = watch('minMagnitude');

  const onSubmit = (values: Filters) => {
    setFilters({
      ...values,
      minMagnitude: Number(values.minMagnitude),
      limit: Number(values.limit),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filters"
      className="w-full max-w-lg"
      actionButtons={[
        { color: 'ghost', onClick: onClose, children: 'Cancel' },
        {
          color: 'primary',
          onClick: handleSubmit(onSubmit),
          children: 'Save & Close',
        },
      ]}
    >
      <Form methods={methods} className="flex flex-col gap-4 py-2">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold">Minimum Magnitude</span>
            <span className="badge badge-primary badge-lg">
              {Number(minMagnitude).toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={9}
            step={0.1}
            className="range range-primary w-full"
            {...register('minMagnitude', { valueAsNumber: true })}
          />
        </div>

        <label className="form-control w-full">
          <span className="mb-1 font-semibold">Number of Earthquakes</span>
          <select
            className="select select-bordered w-full"
            {...register('limit', { valueAsNumber: true })}
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <FormToggleSwitch
          name="dateEnabled"
          labelText="Set Date Range"
          color="primary"
        />

        {dateEnabled ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="form-control w-full">
              <span className="mb-1 text-sm font-semibold">Start</span>
              <input
                type="date"
                className="input input-bordered w-full"
                {...register('startTime')}
              />
            </label>
            <label className="form-control w-full">
              <span className="mb-1 text-sm font-semibold">End</span>
              <input
                type="date"
                className="input input-bordered w-full"
                {...register('endTime')}
              />
            </label>
          </div>
        ) : null}

        <label className="form-control w-full">
          <span className="mb-1 font-semibold">Order By</span>
          <select
            className="select select-bordered w-full"
            {...register('orderBy')}
          >
            {ORDER_BY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </Form>
    </Modal>
  );
};

export default FiltersModal;
