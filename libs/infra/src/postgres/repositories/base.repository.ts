import { paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { DeepPartial } from 'typeorm/common/DeepPartial';
import { ObjectId } from 'typeorm/driver/mongodb/typings';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { DeleteResult } from 'typeorm/query-builder/result/DeleteResult';
import { UpdateResult } from 'typeorm/query-builder/result/UpdateResult';
import { BaseEntity } from 'typeorm/repository/BaseEntity';
import { SaveOptions } from 'typeorm/repository/SaveOptions';
import { BasePaginationDto } from '../paginate';

export class BaseRepository<Entity extends BaseEntity> {
  constructor(protected repository: Repository<Entity>) {}

  async create(entityData: DeepPartial<Entity>): Promise<Entity> {
    return this.repository.save(entityData);
  }

  async bulkCreate(entityData: DeepPartial<Entity>[]): Promise<Entity[]> {
    return this.repository.save(entityData);
  }

  async update(
    criteria: string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[] | FindOptionsWhere<Entity>,
    partialEntity: QueryDeepPartialEntity<Entity>,
  ): Promise<UpdateResult> {
    return this.repository.update(criteria, partialEntity);
  }

  findOne(options: FindOneOptions<Entity>): Promise<Entity> {
    return this.repository.findOne(options);
  }

  count(options?: FindManyOptions<Entity>): Promise<number> {
    return this.repository.count(options);
  }

  isExist(options: FindOneOptions<Entity>): Promise<boolean> {
    return this.repository.exists(options);
  }

  find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
    return this.repository.find(options);
  }

  delete(criteria: FindOptionsWhere<Entity>): Promise<DeleteResult> {
    return this.repository.delete(criteria);
  }

  save<T extends DeepPartial<Entity>>(entity: T, options?: SaveOptions): Promise<T & Entity> {
    return this.repository.save(entity, options);
  }

  paginate(basePagination: BasePaginationDto, options: FindOptionsWhere<Entity> | FindManyOptions<Entity>) {
    return paginate<Entity>(this.repository, basePagination, options);
  }
}
