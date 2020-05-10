import React, { Component } from 'react';
import { Table } from '@jpmorganchase/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';

/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[],
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 *
  We want this element to behave like an HTML Element
 * We can extend the HTMLElement class from the PerspectiveViewerElement
 */
interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
  // Perspective table
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element to attach the table from the DOM.
    // const elem: PerspectiveViewerElement = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    // because we changed the PerspectiveViewerElement to extend the HTMLElement, we can just assign 'elem' to the result of document.getElementsByTagName
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.

      // Add more Perspective configurations here.
      elem.load(this.table);
      // the view is the kind of graph we want to visualize the data as
      // initially, it was a grid type, but since we want a continuous line graph, the closest one would be the y_line
      elem.setAttribute('view', 'y_line');
      // the column-pivots is what will allow us to distinguish stock ABC with DEF
      // Therefore, we use stock as its corresponding value
      elem.setAttribute('column-pivots', '["stock"]');
      // row-pivots takes care of our x-axis which allows us to map each datapoint based on the timestamp it has
      // without row-pivots, the x-axis is blank
      elem.setAttribute('row-pivots', '["timestamp"]');
      // columns is what will allow us to only focus on a particular part of a stock's data along the y-axis
      // because we only care about top_ask_price here, we pass it in
      // without using it, we'd get different datapoints of a stock like: top_bid_price, stock, timestamp
      elem.setAttribute('columns', '["top_ask_price"]');
      // aggregates allow us to handle duplicated data from the initial data and consolidate them as just one data point
      // in this instance, we only want to consider a data point unique if it has a unique stock name and timestamp
      // otherwise, if there are duplicates, we average out the top_bid_price and the top_ask_price in order to treat them as one datapoint
      elem.setAttribute('aggregates', `
        {"stock": "distinct count",
        "top_ask_price": "avg",
        "top_bid_price": "avg",
        "timestamp": "distinct count"
      }`);
    }
  }

  componentDidUpdate() {
    // Everytime the data props is updated, insert the data into Perspective table
    if (this.table) {
      // As part of the task, you need to fix the way we update the data props to
      // avoid inserting duplicated entries into Perspective table again.
      this.table.update(this.props.data.map((el: any) => {
        // Format the data from ServerRespond to the schema
        return {
          stock: el.stock,
          top_ask_price: el.top_ask && el.top_ask.price || 0,
          top_bid_price: el.top_bid && el.top_bid.price || 0,
          timestamp: el.timestamp,
        };
      }));
    }
  }
}

export default Graph;
