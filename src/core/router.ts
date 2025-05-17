import type { Router, RequestHandler, Request, Response, NextFunction } from "express";
import type { ErrorDetail, IValidator } from "./validation";

const methods = ["get", "post", "put", "patch", "delete", "head", "options"] as const;

type Method = (typeof methods)[number];

export type ErrorHandler = (errors: ErrorDetail[], req: Request, res: Response, next: NextFunction) => void;

type TypedRouter<PathParams, Query, Body> = Omit<Router, Method> & {
  [K in Method]: (
    path: string | RegExp | (string | RegExp)[],
    ...handler: RequestHandler<PathParams, any, Body, Query>[]
  ) => void;
};

type EndpointValidator<PathParams, Query, Body> = {
  params?: IValidator<PathParams>;
  query?: IValidator<Query>;
  body?: IValidator<Body>;
};

export function applyValidationMiddleware<PathParams, Query, Body>(
  router: Router,
  validator: EndpointValidator<PathParams, Query, Body>,
  onError?: ErrorHandler
) {
  for (const method of methods) {
    const orig = router[method].bind(router);
    router[method] = (path: any, ...handlers: any[]) => {
      return orig(path, [validationMiddleware(validator, onError), ...handlers]);
    };
  }

  return router as TypedRouter<PathParams, Query, Body>;
}

function validationMiddleware<PathParams, Query, Body>(
  validator: EndpointValidator<PathParams, Query, Body>,
  onError?: ErrorHandler
) {
  return async function (req: Request, _res: Response, next: NextFunction) {
    const sources = ["params", "query", "body"] as const;
    const executions = sources
      .map((source) => (validator[source] ? { validator: validator[source], obj: req[source] } : undefined))
      .filter(Boolean) as { validator: IValidator<PathParams | Query | Body>; obj: unknown }[];

    const errors = validateRequest(executions);
    if (errors.length > 0) {
      onError ? onError(errors, req, _res, next) : next(errors);
      return;
    } else {
      next();
    }
  };
}

function validateRequest<T>(executions: { validator: IValidator<T>; obj: unknown }[]) {
  return executions.reduce<ErrorDetail[]>((acc, { validator, obj }) => {
    const result = validator.validate(obj);
    if (result.success) {
      return acc;
    } else {
      return [...acc, ...result.error];
    }
  }, []);
}
