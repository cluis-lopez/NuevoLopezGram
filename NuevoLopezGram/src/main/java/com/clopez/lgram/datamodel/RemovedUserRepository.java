package com.clopez.lgram.datamodel;

import java.util.List;

import org.springframework.cloud.gcp.data.datastore.repository.DatastoreRepository;
import org.springframework.cloud.gcp.data.datastore.repository.query.Query;
import org.springframework.data.repository.query.Param;

public interface RemovedUserRepository extends DatastoreRepository<RemovedUser, String>{

}
