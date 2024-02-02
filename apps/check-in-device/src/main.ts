/**
 *
 */

import {
  BaseContext,
  DataType,
  ExternalDataSource,
  ExternalInput,
  GetListResponse,
  SearchDataQuery,
} from '@nuclent/nflow-scripts';

import qs from 'node:querystring';

type ResType = {
  isOnline: boolean;
  id: string;
  name: string;
  ip: string;
};

type ColResType = {
  data: ResType[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
};

class DataSource extends ExternalDataSource {
  private getUrl(ctx: BaseContext): string {
    const host = String(ctx.credential.data.url);
    const url = new URL('devices', host);
    return url.href;
  }
  private toDataType(res: ResType, _url: string): DataType {
    return {
      ...res,
      externalId: res.id,
      displayUrl: res.ip,
    };
  }

  async getList(
    args: SearchDataQuery,
    context?: BaseContext
  ): Promise<GetListResponse> {
    const { searchText, filters } = args;
    const { limit = 10, offset = 0 } = args.type === 'offset' ? args : {};

    const fl = filters?.flat(2) || [];
    const userIdFl = fl.find((f) => f.fieldName === 'userId')?.value as string;
    const isOnFilter = fl.find((f) => f.fieldName === 'isOnline')
      ?.value as boolean;

    const url =
      this.getUrl(context) +
      `?${qs.stringify({
        limit: 1000,
        offset: 0,
        ...(userIdFl ? { ['x-user-id']: userIdFl } : {}),
      })}`;
    const request = await fetch(url, {
      method: 'get',
      headers: context.credential.data['requestHeaders'],
    });
    const response: ColResType = await request.json();
    if (!response.data) {
      console.info({ response });
    }

    const data: GetListResponse[0] = response.data
      .filter((i) => {
        if (isOnFilter != undefined && i.isOnline !== isOnFilter) return false;
        if (searchText) {
          return [i.name.toLowerCase(), i.ip.toLowerCase()].some((v) =>
            v.includes(searchText)
          );
        }
        return true;
      })
      .map((r) => this.toDataType(r, url));
    const page: GetListResponse[1] = {
      total: `${data.length}`,
      limit,
      offset,
    };
    return [data.slice(offset, offset + limit), page];
  }

  async getItem(
    args: Pick<ExternalInput, 'externalId'>,
    context?: BaseContext
  ): Promise<DataType> {
    const url = this.getUrl(context);
    const request = await fetch(`${url}/${args.externalId}`, {
      method: 'get',
      headers: context.credential.data['requestHeaders'],
    });
    const response: ResType = await request.json();
    return this.toDataType(response, url);
  }

  async createItem(
    args: Pick<ExternalInput, 'body'>,
    context?: BaseContext
  ): Promise<DataType> {
    // const url = this.getUrl(context?.env);
    // const request = await fetch(url, {
    //   method: 'post',
    //   headers: { 'content-type': 'application/json' },
    //   body: JSON.stringify(args.body || {}),
    // });
    // const response: ResType = await request.json();
    // return this.toDataType(response, url);
    throw new Error('Not implement.');
  }

  async updateItem(
    args: ExternalInput,
    context?: BaseContext
  ): Promise<DataType> {
    // const url = this.getUrl(context);
    // const request = await fetch(`${url}/${args.externalId}`, {
    //   method: 'put',
    //   headers: { 'content-type': 'application/json' },
    //   body: JSON.stringify(args.body || {}),
    // });
    // const response: ResType = await request.json();
    // return this.toDataType(response, url);
    throw new Error('Not implement.');
  }

  async deleteItem(
    args: Pick<ExternalInput, 'externalId'>,
    context?: BaseContext
  ): Promise<DataType> {
    // const url = this.getUrl(context?.env);
    // const request = await fetch(`${url}/${args.externalId}`, {
    //   method: 'delete',
    // });
    // const response: ResType = await request.json();
    // return this.toDataType(response, url);
    throw new Error('Not implement.');
  }
}

module.exports = new DataSource();
