package com.clopez.lgram.datamodel;

import org.springframework.cloud.gcp.data.datastore.repository.DatastoreRepository;

public interface EventRepository extends DatastoreRepository<Event, String>{

}
