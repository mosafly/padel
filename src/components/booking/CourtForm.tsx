import React, { useState } from "react";

export type CourtFormData = {
  name: string;
  description: string;
  price_per_hour: number;
  image_url: string;
  status: "available" | "reserved" | "maintenance";
};

interface CourtFormProps {
  initialData?: CourtFormData;
  onSubmit: (data: CourtFormData) => void;
  isSubmitting: boolean;
}

const defaultFormData: CourtFormData = {
  name: "",
  description: "",
  price_per_hour: 0,
  image_url: "",
  status: "available",
};

const CourtForm: React.FC<CourtFormProps> = ({
  initialData = defaultFormData,
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<CourtFormData>(initialData);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "price_per_hour" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Court Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-input"
          rows={3}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="price_per_hour" className="form-label">
          Price per Hour ($)
        </label>
        <input
          type="number"
          id="price_per_hour"
          name="price_per_hour"
          min="0"
          step="0.01"
          value={formData.price_per_hour}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="image_url" className="form-label">
          Image URL
        </label>
        <input
          type="url"
          id="image_url"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          className="form-input"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="form-group">
        <label htmlFor="status" className="form-label">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="form-input"
          required
        >
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? "Saving..." : "Save Court"}
        </button>
      </div>
    </form>
  );
};

export default CourtForm;
