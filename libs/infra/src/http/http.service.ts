import { Logger } from '@libs/common/loggers/logger.service';
import { HEADER_REQ_ID, HEADER_VERSION_KEY } from '@libs/constants/context.constant';
import { IHttpService, IHttpServiceOptions, IHttpServiceRequestOptions, IHttpServiceResponse } from '@libs/infra/http';
import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { merge } from 'lodash';
import { nanoid } from 'nanoid';
import { ClsServiceManager } from 'nestjs-cls';

@Injectable()
export class HttpService implements IHttpService {
  private readonly _logger = new Logger(HttpService.name);

  constructor(private readonly options: IHttpServiceOptions) {
    this.options.headers = this.options.headers || {};
    this.options.timeout = this.options.timeout || 10000;
    this.options.maxRedirects = this.options.maxRedirects || 5;

    const { version } = this.options;
    if (version) {
      this.options.headers[HEADER_VERSION_KEY] = version;
    }
  }

  public async get<T = any>(
    path: string,
    params: object = {},
    options: IHttpServiceRequestOptions = {},
  ): Promise<IHttpServiceResponse<T>> {
    const config = this.getConfigs({ ...options, ...params });
    this._logger.log(`[HTTP] ${JSON.stringify({ method: 'GET', path, config })}`);
    return this.getResponse<T>(axios.get(path, config));
  }

  public async post<T = any>(
    path: string,
    data: object = {},
    options: IHttpServiceRequestOptions = {},
  ): Promise<IHttpServiceResponse<T>> {
    const config = this.getConfigs(options);
    this._logger.log(`[HTTP] ${JSON.stringify({ method: 'POST', path, data, config })}`);
    return this.getResponse<T>(axios.post(path, data, config));
  }

  public async put<T = any>(
    path: string,
    data: object = {},
    options: IHttpServiceRequestOptions = {},
  ): Promise<IHttpServiceResponse<T>> {
    const config = this.getConfigs(options);
    this._logger.log(`[HTTP] ${JSON.stringify({ method: 'PUT', path, data, config })}`);
    return this.getResponse<T>(axios.put(path, data, config));
  }

  public async delete<T = any>(
    path: string,
    options: IHttpServiceRequestOptions = {},
  ): Promise<IHttpServiceResponse<T>> {
    const config = this.getConfigs(options);
    this._logger.log(`[HTTP] ${JSON.stringify({ method: 'DELETE', path, config })}`);
    return this.getResponse<T>(axios.delete(path, config));
  }

  private getConfigs(options: object = {}): IHttpServiceRequestOptions {
    const extraHeaders = {
      headers: {
        [HEADER_REQ_ID]: ClsServiceManager.getClsService().getId() ?? nanoid(),
      },
    };

    return merge({}, this.options, extraHeaders, options);
  }

  private async getResponse<T>(result: Promise<AxiosResponse>): Promise<IHttpServiceResponse<T>> {
    const startTime = Date.now();
    const { status, statusText, headers, data } = await result;
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    this._logger.log(`[HTTP Response] Response time: ${responseTime}ms`);

    return {
      status,
      statusText,
      headers: JSON.parse(JSON.stringify(headers)),
      data: data as T,
    };
  }
}
