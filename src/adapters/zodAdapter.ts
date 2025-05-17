import { z } from "zod";
import type { Router } from "express";
import type { ValidationResult } from "../core/validation";
import { applyValidationMiddleware, type ErrorHandler } from "../core/router";

type EndpointSchema<PathParams, Query, Body> = {
  params?: PathParams;
  query?: Query;
  body?: Body;
};

function zodAdapter(schema: z.AnyZodObject) {
  const validate = (obj: unknown): ValidationResult<z.infer<typeof schema>> => {
    const result = schema.safeParse(obj);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: result.error.issues.map(({ message, path }) => ({ message, path })),
      };
    }
  };

  return { validate };
}

export function zodTypedRoutes<
  PathParams extends z.AnyZodObject,
  Query extends z.AnyZodObject,
  Body extends z.AnyZodObject
>(router: Router, schema: EndpointSchema<PathParams, Query, Body>, onError?: ErrorHandler) {
  return applyValidationMiddleware<z.infer<PathParams>, z.infer<Query>, z.infer<Body>>(
    router,
    {
      params: schema.params ? zodAdapter(schema.params) : undefined,
      query: schema.query ? zodAdapter(schema.query) : undefined,
      body: schema.body ? zodAdapter(schema.body) : undefined,
    },
    onError
  );
}
